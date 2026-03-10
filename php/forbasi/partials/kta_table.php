<?php
// partials/kta_table.php
if (!empty($kta_applications)): ?>
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
                <th>Bukti Bayar User</th>
                <th>Bukti Bayar Pengcab</th>
                <th>Bukti Bayar Pengda</th>
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
                    <td><?php echo $app['pengcab_payment_proof_path'] ? '<a href="' . htmlspecialchars($app['pengcab_payment_proof_path']) . '" target="_blank" class="file-link">Lihat</a>' : 'Belum diupload'; ?></td>
                    <td><?php echo $app['pengda_payment_proof_path'] ? '<a href="' . htmlspecialchars($app['pengda_payment_proof_path']) . '" target="_blank" class="file-link">Lihat</a>' : 'Belum diupload'; ?></td>
                    <td><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $app['status']))); ?></td>
                    <td>
                        <button class="btn btn-success" onclick="openModal(<?php echo $app['id']; ?>, 'approved_pengda')">Setujui</button>
                        <button class="btn btn-danger" onclick="openModal(<?php echo $app['id']; ?>, 'rejected')">Tolak</button>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php else: ?>
    <p>Tidak ada pengajuan KTA yang menunggu verifikasi Anda.</p>
<?php endif; ?>