<?php if (isset($kta_applications['error'])): ?>
    <div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> <?php echo $kta_applications['error']; ?></div>
<?php elseif (empty($kta_applications)): ?>
    <p>Tidak ada pengajuan KTA yang menunggu verifikasi Anda.</p>
<?php else: ?>
    <table class="kta-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Nama Club</th>
                <th>Penanggung Jawab</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Provinsi</th>
                <th>Kabupaten</th>
                <th>Alamat Club</th>
                <th>Logo</th>
                <th>AD</th>
                <th>ART</th>
                <th>SK</th>
                <th>Bukti Bayar</th>
                <th>Status</th>
                <th>Aksi</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($kta_applications as $app): ?>
                <tr>
                    <td><?php echo htmlspecialchars($app['id']); ?></td>
                    <td><?php echo htmlspecialchars($app['club_name']); ?></td>
                    <td><?php echo htmlspecialchars($app['leader_name']); ?></td>
                    <td><?php echo htmlspecialchars($app['user_email']); ?></td>
                    <td><?php echo htmlspecialchars($app['user_phone']); ?></td>
                    <td><?php echo htmlspecialchars($app['province']); ?></td>
                    <td><?php echo htmlspecialchars($app['regency']); ?></td>
                    <td><?php echo htmlspecialchars($app['club_address']); ?></td>
                    <td><a href="<?php echo htmlspecialchars($app['logo_path']); ?>" target="_blank" class="file-link">Lihat</a></td>
                    <td><?php echo $app['ad_file_path'] ? '<a href="' . htmlspecialchars($app['ad_file_path']) . '" target="_blank" class="file-link">Lihat</a>' : 'N/A'; ?></td>
                    <td><a href="<?php echo htmlspecialchars($app['art_file_path']); ?>" target="_blank" class="file-link">Lihat</a></td>
                    <td><a href="<?php echo htmlspecialchars($app['sk_file_path']); ?>" target="_blank" class="file-link">Lihat</a></td>
                    <td><a href="<?php echo htmlspecialchars($app['payment_proof_path']); ?>" target="_blank" class="file-link">Lihat</a></td>
                    <td><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $app['status']))); ?></td>
                    <td>
                        <button class="btn btn-success" onclick="openModal(<?php echo $app['id']; ?>, 'approved_pengcab')">Setujui</button>
                        <button class="btn btn-danger" onclick="openModal(<?php echo $app['id']; ?>, 'rejected')">Tolak</button>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>